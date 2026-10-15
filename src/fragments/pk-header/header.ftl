<header class="pk-header">

	<!--  Progress bar   -->
	<div class="pk-header__scroll-progress"></div>

	<div class="pk-header__container pk-container">

		<!-- Logo -->
		<a
			class="pk-header__logo"
			data-lfr-editable-id="logo-link"
			data-lfr-editable-type="link"
			href="/"
			id="fragment-${fragmentEntryLinkNamespace}-logo-link"
			aria-label="PortalKit">
			<img
				class="pk-header__logo-image"
				data-lfr-editable-id="logo"
				data-lfr-editable-type="image"
				src="/img/logo-portal-kit.png"
				alt="PortalKit">
		</a>

		<!-- Navigation -->
		<nav class="pk-header__navigation" aria-label="Navegación principal">

			<ul class="pk-header__menu">

				[#if sourceObject??]

					[#list sourceObject.navItems as navItem]

						<li class="pk-header__item[#if navItem.hasChildren()] has-submenu[/#if]">

							<a
								class="pk-header__link"
								href="${navItem.getURL()}"
								[#if navItem.hasChildren()]
									aria-haspopup="true"
									aria-expanded="false"
								[/#if]
							>

								<span>
									${navItem.getName()}
								</span>

								[#if navItem.hasChildren()]

									<i class="bi bi-chevron-down pk-header__arrow" aria-hidden="true"></i>

								[/#if]

							</a>


							[#if navItem.hasChildren()]

								<ul class="pk-header__submenu">

									[#list navItem.getChildren() as child]

										<li class="pk-header__submenu-item">

											<a
												class="pk-header__submenu-link"
												href="${child.getURL()}"
											>
												${child.getName()}
											</a>

										</li>

									[/#list]

								</ul>

							[/#if]

						</li>

					[/#list]

				[/#if]

			</ul>

		</nav>

		<!-- CTA -->
		[#if configuration.showCta!true]
			<a
				class="pk-header__cta"
				data-lfr-editable-id="cta"
				data-lfr-editable-type="link"
				href=""
				id="fragment-${fragmentEntryLinkNamespace}-cta">
				<#--  <span>Qué hacemos</span>  -->
				Qué hacemos
				<#--  <span class="pk-header__cta-icon" aria-hidden="true">↗</span>  -->
				<i class="bi bi-arrow-up-right"></i>
			</a>
		[/#if]

		<!-- Mobile toggle -->
		<button
			class="pk-header__toggle"
			type="button"
			aria-label="Abrir menú"
			aria-expanded="false">
			<i class="bi bi-list" aria-hidden="true"></i>
		</button>

	</div>

</header>
